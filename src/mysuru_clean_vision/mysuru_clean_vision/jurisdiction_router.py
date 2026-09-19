import os
import json
import urllib.request
from shapely.geometry import Point, Polygon

class JurisdictionRouter:
    def __init__(self, geojson_path=None):
        if geojson_path is None:
            candidates = [
                os.path.expanduser('~/mysuru_ws/src/mysuru_clean_vision/data/boundaries.json'),
                '/share/mysuru_clean_vision/data/boundaries.json'
            ]
            for c in candidates:
                if os.path.exists(c):
                    geojson_path = c
                    break

        self.polygons = []
        if geojson_path and os.path.exists(geojson_path):
            try:
                with open(geojson_path, 'r') as f:
                    data = json.load(f)
                    for feature in data.get('features', []):
                        authority = feature['properties'].get('authority', 'Unknown Authority')
                        coords = feature['geometry']['coordinates'][0]
                        poly = Polygon([(pt[0], pt[1]) for pt in coords])
                        self.polygons.append({
                            'authority': authority,
                            'polygon': poly
                        })
            except Exception as e:
                print(f"[JurisdictionRouter] Error loading offline boundaries: {e}")

        # In-memory cache for reverse geocoding requests
        self.geo_cache = {}

    def get_current_gps(self):
        """
        Fetches real-time IP Geolocation of the host machine (e.g. Chennai, Mysuru, Bengaluru).
        Returns: (lat, lon)
        """
        try:
            req = urllib.request.urlopen('http://ip-api.com/json/', timeout=3)
            data = json.loads(req.read().decode('utf-8'))
            if data.get('status') == 'success':
                lat, lon = float(data['lat']), float(data['lon'])
                print(f"[JurisdictionRouter] Auto-detected Live GPS Location: {lat}, {lon} ({data.get('city')}, {data.get('regionName')})")
                return lat, lon
        except Exception as e:
            print(f"[JurisdictionRouter] IP Geolocation lookup failed: {e}. Falling back to default.")

        # Default fallback
        return 12.2958, 76.6394

    def get_authority(self, lat, lon):
        """
        Dynamically routes GPS coordinates to exact local micro-jurisdiction level details anywhere in India:
        1. Checks local GeoJSON polygon boundaries (Shapely)
        2. Performs Reverse Geocoding via Nominatim API to extract suburb/neighbourhood/ward/city/district
        """
        cache_key = (round(lat, 4), round(lon, 4))
        if cache_key in self.geo_cache:
            return self.geo_cache[cache_key]

        # 1. Check local polygon boundaries
        point = Point(lon, lat)
        for zone in self.polygons:
            if zone['polygon'].contains(point) or zone['polygon'].intersects(point):
                self.geo_cache[cache_key] = zone['authority']
                return zone['authority']

        # 2. Reverse Geocode via Nominatim API for exact micro-jurisdiction level matching
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
            req = urllib.request.Request(url, headers={'User-Agent': 'MysuruCleanVision/1.0'})
            res = urllib.request.urlopen(req, timeout=3)
            data = json.loads(res.read().decode('utf-8'))
            addr = data.get('address', {})

            neighbourhood = addr.get('neighbourhood') or addr.get('quarter') or addr.get('suburb') or ''
            suburb = addr.get('suburb') or addr.get('city_district') or addr.get('county') or ''
            city = addr.get('city') or addr.get('town') or addr.get('state_district') or 'Municipal Jurisdiction'

            # Build detailed micro-jurisdiction hierarchy (e.g., "Zone 5 Royapuram - Ward 57, Chennai Corporation")
            parts = []
            if neighbourhood:
                parts.append(neighbourhood)
            if suburb and suburb != neighbourhood:
                parts.append(suburb)
            if city:
                parts.append(city)

            authority_name = ", ".join(parts) if parts else f"Zone ({lat:.3f}, {lon:.3f})"
            self.geo_cache[cache_key] = authority_name
            return authority_name

        except Exception as e:
            print(f"[JurisdictionRouter] Reverse geocoding lookup failed: {e}")
            fallback_name = f"Municipal Zone ({lat:.4f}, {lon:.4f})"
            self.geo_cache[cache_key] = fallback_name
            return fallback_name
