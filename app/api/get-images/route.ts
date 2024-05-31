import { respData, respErr } from "@/lib/resp";

import { Image } from "@/types/image";
import { getImages } from "@/models/image";

export async function POST(req: Request) {
  try {
    const { page } = await req.json();
    const limit = 30;

    const images: Image[] = await getImages(page, limit);

    return respData(images);
  } catch (e) {
    console.log("get images failed", e);
    return respErr("get images failed");
  }
}
