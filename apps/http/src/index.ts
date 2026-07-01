import app from "./app";

// dotenv.config();

const PORT = process.env.PORT || 8000;

// dbConnect()
//   .then(() => {
app.listen(PORT, () => {
	console.log(`Started http server at PORT: ${PORT}`);
});
// })
// .catch((error) => {
//   console.log("Database failed to connect", error);
// });
