import { QueryResult, QueryResultRow } from "pg";

import { Image } from "@/types/image";
import { getDb } from "./db";

export async function insertImage(image: Image) {
  const db = getDb();
  const res = await db.query(
    `INSERT INTO images 
        (user_email, img_description, img_size, img_url, llm_name, llm_params, created_at, uuid, status) 
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      image.user_email,
      image.img_description,
      image.img_size,
      image.img_url,
      image.llm_name,
      image.llm_params,
      image.created_at,
      image.uuid,
      image.status,
    ]
  );

  return res;
}

export async function getImagesCount(): Promise<number> {
  const db = getDb();
  const res = await db.query(`SELECT count(1) as count FROM images`);
  if (res.rowCount === 0) {
    return 0;
  }

  const { rows } = res;
  const row = rows[0];

  return row.count;
}

export async function getUserImagesCount(user_email: string): Promise<number> {
  const db = getDb();
  const res = await db.query(
    `SELECT count(1) as count FROM images WHERE user_email = $1`,
    [user_email]
  );
  if (res.rowCount === 0) {
    return 0;
  }

  const { rows } = res;
  const row = rows[0];

  return row.count;
}

export async function findImageById(id: number): Promise<Image | undefined> {
  const db = getDb();
  const res = await db.query(
    `select w.*, u.uuid as user_uuid, u.email as user_email, u.nickname as user_name, u.avatar_url as user_avatar from images as w left join users as u on w.user_email = u.email where w.id = $1`,
    [id]
  );
  if (res.rowCount === 0) {
    return;
  }

  const image = formatImage(res.rows[0]);

  return image;
}

export async function findImageByUuid(
  uuid: string
): Promise<Image | undefined> {
  const db = getDb();
  const res = await db.query(
    `select w.*, u.uuid as user_uuid, u.email as user_email, u.nickname as user_name, u.avatar_url as user_avatar from images as w left join users as u on w.user_email = u.email where w.uuid = $1`,
    [uuid]
  );
  if (res.rowCount === 0) {
    return;
  }

  const image = formatImage(res.rows[0]);

  return image;
}

export async function getRandImages(
  page: number,
  limit: number
): Promise<Image[]> {
  if (page <= 0) {
    page = 1;
  }
  if (limit <= 0) {
    limit = 50;
  }
  const offset = (page - 1) * limit;

  const db = getDb();
  const res = await db.query(
    `select w.*, u.uuid as user_uuid, u.email as user_email, u.nickname as user_name, u.avatar_url as user_avatar from images as w left join users as u on w.user_email = u.email where w.status = 1 order by random() limit $1 offset $2`,
    [limit, offset]
  );

  if (res.rowCount === 0) {
    return [];
  }

  const images = getImagesFromSqlResult(res);

  return images;
}

export async function getImages(page: number, limit: number): Promise<Image[]> {
  if (page < 1) {
    page = 1;
  }
  if (limit <= 0) {
    limit = 50;
  }
  const offset = (page - 1) * limit;

  const db = getDb();
  const res = await db.query(
    `select w.*, u.uuid as user_uuid, u.email as user_email, u.nickname as user_name, u.avatar_url as user_avatar from images as w left join users as u on w.user_email = u.email where w.status = 1 order by w.created_at desc limit $1 offset $2`,
    [limit, offset]
  );
  if (res.rowCount === 0) {
    return [];
  }

  const images = getImagesFromSqlResult(res);

  return images;
}

export function getImagesFromSqlResult(
  res: QueryResult<QueryResultRow>
): Image[] {
  if (!res.rowCount || res.rowCount === 0) {
    return [];
  }

  const images: Image[] = [];
  const { rows } = res;
  rows.forEach((row) => {
    const image = formatImage(row);
    if (image) {
      images.push(image);
    }
  });

  return images;
}

export function formatImage(row: QueryResultRow): Image | undefined {
  let image: Image = {
    id: row.id,
    user_email: row.user_email,
    img_description: row.img_description,
    img_size: row.img_size,
    img_url: row.img_url,
    llm_name: row.llm_name,
    llm_params: row.llm_params,
    created_at: row.created_at,
    uuid: row.uuid,
    status: row.status,
  };

  if (row.user_name || row.user_avatar) {
    image.created_user = {
      email: row.user_email,
      nickname: row.user_name,
      avatar_url: row.user_avatar,
      uuid: row.user_uuid,
    };
  }

  try {
    image.llm_params = JSON.parse(JSON.stringify(image.llm_params));
  } catch (e) {
    console.log("parse image llm_params failed: ", e);
  }

  return image;
}
