import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")


    def test_config_status_endpoint(self):
        response = self.client.get("/api/v1/config/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("is_configured", data)
        self.assertIn("base_url", data)


if __name__ == "__main__":
    unittest.main()

