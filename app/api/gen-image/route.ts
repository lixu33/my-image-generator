import { respData, respErr } from "@/lib/resp";

import { Image } from "@/types/image";
import { ImageGenerateParams } from "openai/resources/images.mjs";
import { currentUser } from "@clerk/nextjs";
import { downloadAndUploadImage } from "@/lib/s3";
import { genUuid } from "@/lib";
import { getOpenAIClient } from "@/services/openai";
import { getUserCredits } from "@/services/order";
import { insertImage } from "@/models/image";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return respErr("no auth");
  }

  try {
    const { description } = await req.json();
    if (!description) {
      return respErr("invalid params");
    }

    const user_email = user.emailAddresses[0].emailAddress;

    const user_credits = await getUserCredits(user_email);
    if (!user_credits || user_credits.left_credits < 1) {
      return respErr("credits not enough");
    }

    const client = getOpenAIClient();

    const llm_name = "dall-e-3";
    const img_size = "1024x1792";

    const llm_params: ImageGenerateParams = {
      prompt: `Generate a image about ${description}`,
      model: llm_name,
      n: 1,
      quality: "hd",
      response_format: "url",
      size: img_size,
      style: "vivid",
    };
    const created_at = new Date().toISOString();

    const res = await client.images.generate(llm_params);
    const raw_img_url = res.data[0].url;
    if (!raw_img_url) {
      return respErr("generate image failed");
    }

    const img_name = encodeURIComponent(description);
    const s3_img = await downloadAndUploadImage(
      raw_img_url,
      process.env.AWS_BUCKET || "",
      `images/${img_name}.png`
    );

    let img_url = s3_img.Location;
    const domain = process.env.AWS_DOMAIN;
    if (domain) {
      img_url = img_url.replace(process.env.AWS_ENDPOINT + '/' + process.env.AWS_BUCKET, domain);
    }

    const image: Image = {
      user_email: user_email,
      img_description: description,
      img_size: img_size,
      img_url: img_url,
      llm_name: llm_name,
      llm_params: JSON.stringify(llm_params),
      created_at: created_at,
      uuid: genUuid(),
      status: 1,
    };
    await insertImage(image);

    return respData(image);
  } catch (e) {
    console.log("gen image failed: ", e);
    return respErr("gen image failed");
  }
}