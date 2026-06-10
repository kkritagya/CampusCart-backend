import app from "./src/app";
import { PORT } from "./src/configs/constant";
import { connectDatabase } from "./src/database/mongodb";

const startServer = async () => {
  await connectDatabase();

  app.listen(Number(PORT), () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
