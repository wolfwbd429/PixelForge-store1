import asyncio
import json
import os
import http.server
import socketserver
from threading import Thread
import websockets

# --- Part 1: Real-Time Chat WebSocket Logic ---
CONNECTED_PLAYERS = set()

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

# --- Part 2: Static Website File Delivery ---
def start_static_web_server(port):
    class MyHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass # Suppress heavy terminal logs for images/assets

    # Serve whatever folder this script is sitting in
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Allow port reuse to prevent deployment crash loops
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("0.0.0.0", port), MyHandler) as httpd:
            print(f"🌐 Website Front-End serving live on port {port}")
            httpd.serve_forever()
    except Exception as e:
        print(f"Web server warning: {e}")

# --- Part 3: Core Entry Point ---
if __name__ == "__main__":
    # Render passes one single port target via environment variables
    PORT = int(os.environ.get("PORT", 10000))
    
    print("🚀 Initializing Unified PixelForge App Stack...")
    
    # Launch the website file server inside a separate background thread
    web_thread = Thread(target=start_static_web_server, args=(PORT,), daemon=True)
    web_thread.start()
    
    # Give the thread a split second to claim the port before the websocket loop checks in
    import time
    time.sleep(0.5)
    
    # Launch the WebSocket router inside the main async loop on the same port context
    asyncio.run(websockets.serve(handle_chat, "0.0.0.0", PORT))
    
    # Keep the main process alive explicitly
    asyncio.get_event_loop().run_forever()
