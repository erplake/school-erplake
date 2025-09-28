import os
import aiofiles
import boto3
from botocore.client import Config
from urllib.parse import urljoin
from .base import Storage

class S3Storage(Storage):
    def __init__(self, bucket: str = None, endpoint: str = None, access_key: str = None, secret_key: str = None, region: str = None):
        self.bucket = bucket or os.getenv('MINIO_BUCKET') or os.getenv('S3_BUCKET')
        endpoint = endpoint or os.getenv('MINIO_ENDPOINT') or os.getenv('S3_ENDPOINT')
        access_key = access_key or os.getenv('S3_ACCESS_KEY') or os.getenv('MINIO_ROOT_USER')
        secret_key = secret_key or os.getenv('S3_SECRET_KEY') or os.getenv('MINIO_ROOT_PASSWORD')
        region = region or os.getenv('MINIO_REGION') or os.getenv('S3_REGION') or 'us-east-1'
        self._endpoint = endpoint
        # boto3 S3 client configured for MinIO if endpoint provided
        extra_args = {}
        if endpoint and endpoint.startswith('http'):
            self.s3 = boto3.resource('s3',
                                     endpoint_url=endpoint,
                                     aws_access_key_id=access_key,
                                     aws_secret_access_key=secret_key,
                                     config=Config(signature_version='s3v4'),
                                     region_name=region)
        else:
            # default boto3 behavior (AWS)
            self.s3 = boto3.resource('s3',
                                     aws_access_key_id=access_key,
                                     aws_secret_access_key=secret_key,
                                     config=Config(signature_version='s3v4'),
                                     region_name=region)

    async def put(self, path: str, data: bytes, content_type: str = 'application/octet-stream') -> str:
        # Upload to S3/MinIO and return object path
        obj = self.s3.Object(self.bucket, path)
        obj.put(Body=data, ContentType=content_type)
        # Construct a URL (signed URL logic handled separately)
        if self._endpoint:
            return f"{self._endpoint}/{self.bucket}/{path}"
        return f"s3://{self.bucket}/{path}"

    async def get(self, path: str) -> bytes:
        obj = self.s3.Object(self.bucket, path)
        resp = obj.get()
        return resp['Body'].read()

    def signed_url(self, path: str, expires: int = 3600) -> str:
        # Generate a presigned URL using boto3 client
        client = boto3.client('s3',
                              endpoint_url=self._endpoint if self._endpoint else None,
                              aws_access_key_id=os.getenv('S3_ACCESS_KEY') or os.getenv('MINIO_ROOT_USER'),
                              aws_secret_access_key=os.getenv('S3_SECRET_KEY') or os.getenv('MINIO_ROOT_PASSWORD'),
                              config=Config(signature_version='s3v4'),
                              region_name=os.getenv('MINIO_REGION') or os.getenv('S3_REGION') or 'us-east-1')
        url = client.generate_presigned_url('get_object',
                                            Params={'Bucket': self.bucket, 'Key': path},
                                            ExpiresIn=expires)
        return url
