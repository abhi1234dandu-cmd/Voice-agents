from __future__ import annotations

import json
import time


def main() -> None:
    while True:
        event = {"worker": "votell-post-call", "status": "idle", "message": "Redis queue adapter placeholder"}
        print(json.dumps(event), flush=True)
        time.sleep(30)


if __name__ == "__main__":
    main()
