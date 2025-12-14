import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, fileType } = await req.json();
    
    console.log("Parsing document:", filePath, fileType);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      throw new Error("Failed to download file");
    }

    let content = "";
    const fileExt = filePath.split(".").pop()?.toLowerCase();

    if (fileExt === "txt" || fileExt === "md") {
      content = await fileData.text();
    } else if (fileExt === "pdf") {
      // For PDF files, use Lovable's document parsing API
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (LOVABLE_API_KEY) {
        try {
          // Get public URL for the file
          const { data: urlData } = supabase.storage
            .from("documents")
            .getPublicUrl(filePath);
          
          console.log("PDF public URL:", urlData.publicUrl);
          
          // Use Lovable AI to extract and summarize the PDF content
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { 
                  role: "user", 
                  content: [
                    { type: "text", text: "Extract all the text content from this PDF document. Return only the extracted text, nothing else." },
                    { type: "image_url", url: urlData.publicUrl }
                  ]
                }
              ],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            content = data.choices?.[0]?.message?.content || "";
            console.log("AI extracted content length:", content.length);
          }
        } catch (e) {
          console.error("AI PDF extraction failed:", e);
        }
      }
      
      // Fallback: Basic text extraction from PDF
      if (!content || content.length < 100) {
        const arrayBuffer = await fileData.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const rawText = decoder.decode(bytes);
        
        // Extract text from PDF streams
        const extractedTexts: string[] = [];
        
        // Look for text between BT and ET markers
        const btEtMatches = rawText.match(/BT[\s\S]*?ET/g) || [];
        for (const block of btEtMatches) {
          const textMatches = block.match(/\(([^)]+)\)/g) || [];
          for (const match of textMatches) {
            const text = match.slice(1, -1);
            if (text.length > 1 && /^[\x20-\x7E\s]+$/.test(text)) {
              extractedTexts.push(text);
            }
          }
        }
        
        // Also try to find Tj and TJ operators
        const tjMatches = rawText.match(/\[([^\]]+)\]\s*TJ/g) || [];
        for (const match of tjMatches) {
          const innerTexts = match.match(/\(([^)]+)\)/g) || [];
          for (const inner of innerTexts) {
            const text = inner.slice(1, -1);
            if (text.length > 1 && /^[\x20-\x7E\s]+$/.test(text)) {
              extractedTexts.push(text);
            }
          }
        }
        
        const fallbackContent = extractedTexts.join(" ").replace(/\s+/g, " ").trim();
        if (fallbackContent.length > content.length) {
          content = fallbackContent;
        }
      }
      
      if (content.length < 50) {
        content = `This is a PDF document titled "${filePath}". The document contains academic content that could not be fully extracted. Please try uploading a text-based version of this document for better results.`;
      }
    } else if (fileExt === "docx" || fileExt === "pptx") {
      try {
        const { unzipSync } = await import("https://esm.sh/fflate@0.8.2");
        const arrayBuffer = await fileData.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Unzip the file using fflate
        const unzipped = unzipSync(bytes);
        const extractedTexts: string[] = [];
        
        // For DOCX, look for word/document.xml
        // For PPTX, look for ppt/slides/slide*.xml
        for (const [filename, fileContent] of Object.entries(unzipped)) {
          let shouldParse = false;
          
          if (fileExt === "docx" && filename.includes("word/document.xml")) {
            shouldParse = true;
          } else if (fileExt === "pptx" && filename.match(/ppt\/slides\/slide\d+\.xml/)) {
            shouldParse = true;
          }
          
          if (shouldParse) {
            const decoder = new TextDecoder("utf-8");
            const xmlContent = decoder.decode(fileContent as Uint8Array);
            
            // Extract text from XML - look for <a:t> and <w:t> tags
            const textMatches = xmlContent.match(/<[aw]:t[^>]*>([^<]*)<\/[aw]:t>/g) || [];
            for (const match of textMatches) {
              const text = match.replace(/<[^>]+>/g, "").trim();
              if (text.length > 0) {
                extractedTexts.push(text);
              }
            }
          }
        }
        
        content = extractedTexts.join(" ").replace(/\s+/g, " ").trim();
        console.log("Extracted content from", fileExt, ":", content.substring(0, 500));
        
        if (content.length < 50) {
          content = `This is a ${fileExt.toUpperCase()} document titled "${filePath}". Content extraction was limited.`;
        }
      } catch (e) {
        console.error("DOCX/PPTX parsing error:", e);
        content = `This is a ${fileExt.toUpperCase()} document titled "${filePath}". Could not extract content.`;
      }
    } else {
      content = `Document: ${filePath} - Unsupported file type for content extraction.`;
    }

    console.log("Final extracted content length:", content.length);
    console.log("Content preview:", content.substring(0, 300));

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Parse document error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
