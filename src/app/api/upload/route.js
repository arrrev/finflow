import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        // Validate File Type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only images are allowed." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Compress and resize image using Sharp
        // Resize to max 200x200 pixels, maintain aspect ratio
        // Convert to JPEG with 80% quality for smaller file size
        const compressedBuffer = await sharp(buffer)
            .resize(200, 200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Check final size (should be much smaller now)
        if (compressedBuffer.length > 100 * 1024) { // 100KB limit
            return NextResponse.json({ error: "Image too large even after compression. Please use a smaller image." }, { status: 400 });
        }

        // Convert to Base64 Data URI
        const base64Data = compressedBuffer.toString("base64");
        const dataUri = `data:image/jpeg;base64,${base64Data}`;

        return NextResponse.json({
            success: true,
            filepath: dataUri
        });
    } catch (error) {
        console.log("Error occurred ", error);
        return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
    }
}

