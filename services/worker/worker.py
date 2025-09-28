import os, time
from rq import Connection, Worker
from redis import Redis

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
queue_names = ["default","pdf","ai","campaign"]

if __name__ == "__main__":
    r = Redis.from_url(redis_url)
    with Connection(r):
        w = Worker(map(str, queue_names))
        w.work(with_scheduler=True)
