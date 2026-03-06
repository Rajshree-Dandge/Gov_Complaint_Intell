from sklearn.cluster import DBSCAN
import numpy as np

def get_clusters(complaints):
    if not complaints: return []

    # 1. Extract coordinates [[lat, lon], [lat, lon]...]
    coords = np.array([[c['latitude'], c['longitude']] for c in complaints])
    
    # 2. Run DBSCAN
    # eps=0.001 is approx 100 meters. min_samples=1 (every point is at least its own cluster)
    db = DBSCAN(eps=0.001, min_samples=1).fit(coords)
    labels = db.labels_

    clusters = []
    unique_labels = set(labels)

    for label in unique_labels:
        # Get all complaints in this specific cluster
        cluster_points = [complaints[i] for i, l in enumerate(labels) if l == label]
        
        # Calculate Cluster Intelligence
        avg_lat = sum(p['latitude'] for p in cluster_points) / len(cluster_points)
        avg_lon = sum(p['longitude'] for p in cluster_points) / len(cluster_points)
        max_severity = max(p['ai_score'] for p in cluster_points)
        count = len(cluster_points)

        clusters.append({
            "lat": avg_lat,
            "lon": avg_lon,
            "severity": max_severity,
            "count": count,
            # Bivariate Logic: Map severity to a color string
            "color": "red" if max_severity >= 8 else "orange" if max_severity >= 5 else "yellow"
        })
    
    return clusters