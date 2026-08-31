from __future__ import annotations

from app.store import store


def main() -> None:
    store.seed()
    print("Seeded Votell demo organization, agent, and knowledge base.")


if __name__ == "__main__":
    main()
