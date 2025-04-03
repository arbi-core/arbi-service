#!/bin/bash

# Start the test database container once for all tests
echo "🚀 Starting test database container..."
npm run test:docker:up

# Wait for the database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..10}; do
  docker exec arbi-service-postgres-test-1 pg_isready -U postgres -p 5433 && break
  echo "Waiting for database to start... ($i/10)"
  sleep 2
  if [ $i -eq 10 ]; then
    echo "❌ Database failed to start within timeout"
    npm run test:docker:down
    exit 1
  fi
done

# Run local tests including websocket tests
echo "Running local tests..."
npm test -- --forceExit

# Run websocket tests specifically
echo "Running WebSocket tests..."
npm run test:websocket -- --forceExit

# Run integration tests in Docker
echo "Running integration tests in Docker..."
npm run test:integration

# Stop the test database container
echo "🧹 Cleaning up test environment..."
npm run test:docker:down

# Check if all tests passed
if [ $? -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed. Please check the output above."
  exit 1
fi