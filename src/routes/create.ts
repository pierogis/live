import { listJurisdictions } from '$lib/database/jurisdictions';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const jurisdictions = await listJurisdictions();

	return {
		body: { jurisdictions }
	};
}

// export default async function get({params}) {
// 	aws.config.update({
// 		accessKeyId: variables.awsAccessKey,
// 		secretAccessKey: variables.awsSecretKey,
// 		region: variables.awsRegion,
// 		signatureVersion: 'v4'
// 	});

// 	const s3 = new aws.S3();
// 	const post = await s3.createPresignedPost({
// 		Bucket: variables.awsBucketName,
// 		Fields: {
// 			key: `${params.jurisdiction}/${params.id}`
// 		},
// 		Expires: 60, // seconds
// 		Conditions: [
// 			['content-length-range', 0, 1048576] // up to 1 MB
// 		]
// 	});

// 	res.status(200).json(post);
// }
