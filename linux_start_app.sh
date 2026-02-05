echo "Starting backend..."
cd Backend || exit
npm start &

sleep 3

echo "Starting frontend..."
cd ../frontend || exit
npm run dev &

wait