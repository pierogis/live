import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { db, platesSchema } from '.';
import type { Image } from './models';

export async function getImages(params: { id?: number; plateId?: number }): Promise<Image[]> {
	const images = await db.withSchema(platesSchema).table('images').select().where(params);

	return images;
}

export async function uploadImage(plateId: number, image: File) {
	// const imageUploadFormData = new FormData();
	// imageUploadFormData.append('file', image);

	const bucketParams = {
		Bucket: 'emporium',
		Key: `plates/${plateId}`,
		Body: image
	};

	// Create a command to put the object in the S3 bucket.
	const command = new PutObjectCommand(bucketParams);
	// Create the presigned URL.
	const signedUrl = await getSignedUrl(s3Client, command, {
		expiresIn: 3600
	});

	const response = await fetch(signedUrl, {
		method: 'PUT',
		body: bucketParams.Body
	});

	const json = await response.json();
}

const s3Client = new S3Client({ region: 'us-east-1' });

export async function createImage(partial: Omit<Image, 'id'>): Promise<Image> {
	const images = await db
		.withSchema(platesSchema)
		.table('images')
		.insert({ plateId: partial.plateId, url: partial.url })
		.returning(['id', 'plateId', 'url']);

	return images[0];
}
