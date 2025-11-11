import ngrok from 'ngrok';

(async () => {
  try {
    const url = await ngrok.connect({ addr: 5000 });
    console.log("Ngrok tunnel:", url);
  } catch (err) {
    console.error("Ngrok error:", err);
  }
})();