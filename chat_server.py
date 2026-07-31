import asyncio
import json
import os
import mimetypes
from http import HTTPStatus
import websockets

CONNECTED_PLAYERS = set()

# --- Part 1: Real-Time Chat WebSocket Logic ---
async def handle_chat(websocket):
    CONNECTED_PLAYERS.add(websocket)
    print(f"🎮 Player connected! Total active: {len(CONNECTED_PLAYERS)}")
    try:
        async for message_data in websocket:
            data = json.loads(message_data)
            print(f"💬 [{data.get('room', 'General')}] {data.get('username')}: {data.get('text')}")
            if CONNECTED_PLAYERS:
                await asyncio.gather(*[player.send(message_data) for player in CONNECTED_PLAYERS])
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        CONNECTED_PLAYERS.remove(websocket)
        print(f"❌ Player disconnected. Total active: {len(CONNECTED_PLAYERS)}")

# --- Part 2: Unified Static Website Router ---
async def process_http_request(path, request_headers):
    # Set the target folder directory path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Strip URL parameters and fall back to index.html if pointing to root path /
    clean_path = path.split('?')[0]
    if clean_path == "/":
        clean_path = "/index.html"
        
    file_path = os.path.join(base_dir, clean_path.lstrip("/"))

    # Check if the requested file exists inside our project folder context
    if os.path.exists(file_path) and os.path.isfile(file_path):
        content_type, _ = mimetypes.guess_type(file_path)
        content_type = content_type or "application/octet-stream"
        
        with open(file_path, "rb") as f:
            body = f.read()
            
        headers = [
            ("Content-Type", content_type),
            ("Content-Length", str(len(body))),
            ("Connection", "close"),
        ]
        return HTTPStatus.OK, headers, body

    # Throw a clean 404 response framework if file doesn't exist
    return HTTPStatus.NOT_FOUND, [("Content-Type", "text/plain")], b"404 Not Found"

# --- Part 3: Core App Entry Node ---
async def main():
    PORT = int(os.environ.get("PORT", 10000))
    print(f"🚀 Initializing Single-Engine PixelForge App Stack on port {PORT}...")
    
    # Pass our custom HTTP router directly into the web socket server initialization
    async with websockets.serve(handle_chat, "0.0.0.0", PORT, process_request=process_http_request):
        await asyncio.Future()  # Keep the single thread completely online forever cleanly

if __name__ == "__main__":
    asyncio.run(main())
