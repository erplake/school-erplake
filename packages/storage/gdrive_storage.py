from .base import Storage

class GDriveStorage(Storage):
    def __init__(self, root_folder_id: str):
        self.root = root_folder_id

    async def put(self, path: str, data: bytes, content_type: str) -> str:
        # TODO: implement using google-api-python-client
        return f"gdrive://{self.root}/{path}"

    async def get(self, path: str) -> bytes:
        raise NotImplementedError

    def signed_url(self, path: str, expires: int = 3600) -> str:
        # Google Drive share links are handled differently
        return f"https://drive.google.com/file/d/{path}/view"
