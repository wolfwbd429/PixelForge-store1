import asyncio
import json
from collections import defaultdict

import websockets

ROOMS = {
    "Minecraft": [],
    "Forza Horizon 5": [],
    "Halo Infinite": [],
    "Sea of Thieves": [],
}

ROOM_SEED = {
    "Minecraft": [
        {"sender": "PixelPilot", "text": "The survival world is full tonight. Who wants to build a castle?"},
        {"sender": "MaraForge", "text": "I am in. Let’s raid the village and prepare a redstone line."},
    ],
    "Forza Horizon 5": [
        {"sender": "TurboRex", "text": "Neon night race is open. Show me your fastest lap."},
        {"sender": "ApexByte", "text": "I am already on the desert route. It is pure speed."},
    ],
    "Halo Infinite": [
        {"sender": "SquadCore", "text": "Drop in for ranked. We need a strong team."},
        {"sender": "GhostDrift", "text": "I will take the flank and hold the objective."},
    ],
    "Sea of Thieves": [
        {"sender": "CaptainMoss", "text": "Treasure is on the horizon. Keep an eye on the storm."},
        {"sender": "NeonWave", "text": "I have the map. We are sailing straight into the next chest."},
    ],
}

for room_name, messages in ROOM_SEED.items():
    ROOMS[room_name] = list(messages)

clients = {}


def room_broadcast(room_name, payload):
    for websocket, meta in list(clients.items()):
        if meta.get("room") == room_name:
            try:
                asyncio.create_task(websocket.send(json.dumps(payload)))
            except Exception:
                pass


async def handler(websocket):
    connected = {"room": "Minecraft", "name": "Guest"}
    clients[websocket] = connected

    async def send_room_state(room_name):
        await websocket.send(json.dumps({
            "type": "sync",
            "room": room_name,
            "messages": ROOMS.get(room_name, [])
        }))

    await send_room_state("Minecraft")

    try:
        async for raw in websocket:
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            message_type = data.get("type")
            room_name = data.get("room", "Minecraft")
            display_name = data.get("name", "Guest")

            if message_type == "join":
                clients[websocket]["room"] = room_name
                clients[websocket]["name"] = display_name
                await send_room_state(room_name)
                continue

            if message_type == "message":
                text = (data.get("text") or "").strip()
                if not text:
                    continue
                msg = {"sender": display_name, "text": text}
                ROOMS.setdefault(room_name, []).append(msg)
                room_broadcast(room_name, {
                    "type": "message",
                    "room": room_name,
                    "message": msg,
                })
    finally:
        clients.pop(websocket, None)


async def main():
    async with websockets.serve(handler, "127.0.0.1", 8765):
        print("PixelForge chat server running on ws://127.0.0.1:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
