import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

class AlertAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Enable CORS
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        alerts_file = '/tmp/civic_alerts.json'
        data = {'live_feed': {}, 'incidents': []}
        if os.path.exists(alerts_file):
            try:
                with open(alerts_file, 'r') as f:
                    data = json.load(f)
            except Exception:
                pass

        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_POST(self):
        # Handle officer verification / status updates
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        try:
            payload = json.loads(post_data.decode('utf-8'))
            alerts_file = '/tmp/civic_alerts.json'
            with open(alerts_file, 'w') as f:
                json.dump(payload, f)
            self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
        except Exception as e:
            self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def main():
    port = 5000
    server_address = ('', port)
    httpd = HTTPServer(server_address, AlertAPIHandler)
    print(f"[AlertAPIHandler] Serving live alerts API at http://localhost:{port}/api/alerts")
    httpd.serve_forever()

if __name__ == '__main__':
    main()
