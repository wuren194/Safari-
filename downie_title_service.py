#!/usr/bin/env python3
"""
Downie Title Service - 本地服务，用于存储和查询视频标题映射
端口: 18080
API:
  POST /add - 添加标题映射 {id, title}
  GET /get?id=xxx - 获取标题
  DELETE /remove?id=xxx - 删除标题
"""

import http.server
import json
import os
import urllib.parse
from pathlib import Path

PORT = 18080
DATA_FILE = os.path.expanduser("~/.downie_titles.json")


def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}


def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class TitleHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # 静默日志
        pass

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if parsed.path == '/get':
            video_id = params.get('id', [None])[0]
            if video_id:
                data = load_data()
                title = data.get(video_id, '')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'title': title}).encode('utf-8'))
            else:
                self.send_response(400)
                self.end_headers()
        elif parsed.path == '/list':
            data = load_data()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/add':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                payload = json.loads(body)
                video_id = payload.get('id')
                title = payload.get('title')
                if video_id and title:
                    data = load_data()
                    data[video_id] = title
                    save_data(data)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
                else:
                    self.send_response(400)
                    self.end_headers()
            except:
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if parsed.path == '/remove':
            video_id = params.get('id', [None])[0]
            if video_id:
                data = load_data()
                if video_id in data:
                    del data[video_id]
                    save_data(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            else:
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()


def main():
    server = http.server.HTTPServer(('127.0.0.1', PORT), TitleHandler)
    print(f"Downie Title Service running on http://127.0.0.1:{PORT}")
    server.serve_forever()


if __name__ == '__main__':
    main()
