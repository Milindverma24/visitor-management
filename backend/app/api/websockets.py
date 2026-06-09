from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        # We store active connections. Could be enhanced to store dicts mapping user roles/plants.
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, payload: dict):
        """
        Broadcasts an event to all connected clients.
        Example event_type: "VISIT_APPROVED", "CHECK_IN", "EMERGENCY_ALERT"
        """
        message = json.dumps({"type": event_type, "payload": payload})
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Failed to send WS message: {e}")
                dead_connections.append(connection)
        
        # Cleanup dead connections
        for conn in dead_connections:
            self.disconnect(conn)

manager = ConnectionManager()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't necessarily expect messages from the client in this architecture,
            # but we need to receive to keep the connection open and detect disconnects.
            data = await websocket.receive_text()
            # Handle client pings or subscriptions here if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

def sync_broadcast(event_type: str, payload: dict):
    import asyncio
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(event_type, payload))
    except RuntimeError:
        # No running loop (e.g. if called from a completely separate thread without loop setup)
        asyncio.run(manager.broadcast(event_type, payload))

