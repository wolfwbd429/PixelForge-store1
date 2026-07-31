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
    # Register new player connection
    CONNECTED_PLAYERS.add(websocket)
    print(f"🎮 Player connected! Total active: {len(CONNECTED_PLAYERS)}")
    
    try:
        async for message_data in websocket:
            # Broadcast the incoming chat message to every active player
            data = json.loads(message_data)
            print(f"💬 [{data.get('room', 'General')}] {data.get('username')}: {data.get('text')}")
            
            # Forward message to all sockets
            if CONNECTED_PLAYERS:
                await asyncio.gather(*[player.send(message_data) for player in CONNECTED_PLAYERS])
                
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        # Unregister player when they leave
        CONNECTED_PLAYERS.remove(websocket)
        print(f"❌ Player disconnected. Total active: {len(CONNECTED_PLAYERS)}")


# --- Part 2: Static Website File Delivery ---
def start_static_web_server(port):
    class MyHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Suppress heavy terminal logs for images/assets

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


# --- Part 3: Clean Unified Entry Loop ---
async def start_combined_stack():
    # Render passes one single port target via environment variables
    PORT = int(os.environ.get("PORT", 10000))
    print("🚀 Initializing Unified PixelForge App Stack...")
    
    # Launch the website file server safely inside a separate background thread
    web_thread = Thread(target=start_static_web_server, args=(PORT,), daemon=True)
    web_thread.start()
    
    # Initialize the WebSocket server loops on the same domain context pool natively
    async with websockets.serve(handle_chat, "0.0.0.0", PORT):
        print(f"💬 WebSocket server pipeline listening live on port {PORT}")
        await asyncio.Future()  # Keep the async pipeline alive forever cleanly


if __name__ == "__main__":
    # Fire up the loop engine on the main thread safely
    asyncio.run(start_combined_stack())
