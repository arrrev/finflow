import { NextResponse } from "next/server";

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

        // Simple File Size Check (limit to 4MB to be safe for DB text and payload)
        if (buffer.length > 4 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Max 4MB." }, { status: 400 });
        }

        // Convert to Base64 Data URI
        const mimeType = file.type;
        const base64Data = buffer.toString("base64");
        const dataUri = `data:${mimeType};base64,${base64Data}`;

        return NextResponse.json({
            success: true,
            filepath: dataUri
        });
    } catch (error) {
        console.log("Error occurred ", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

