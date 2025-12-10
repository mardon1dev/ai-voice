const muhammadjonRequest = async (body: FormData) => {
  const request = await fetch(
    "https://710b5c68b77c.ngrok-free.app/api/v1/transcribe",
    {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      body: body,
    }
  );
  return request;
};

const saidaloRequest = async (body: FormData) => {
  const request = await fetch("http://192.168.20.36:8080/api/voice/upload", {
    method: "POST",
    body: body,
  });
  return request;
};

const abbosRequest = async (body: FormData) => {
  const request = await fetch("http://192.168.20.138:8080/api/v1/voice", {
    method: "POST",
    body: body,
  });
  return request;
};

const bilolxonRequest = async (body: FormData) => {
  const request = await fetch("http://192.168.20.213:8000/index.php", {
    method: "POST",
    body: body,
  });
  return request;
};

export { abbosRequest, muhammadjonRequest, saidaloRequest, bilolxonRequest };
