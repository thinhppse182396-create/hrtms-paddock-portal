export const getHorses = async () => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/horses`);
  if (!response.ok) throw new Error("Không thể lấy danh sách ngựa");
  return response.json();
};

export const createHorse = async (horse) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/horses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(horse),
  });
  if (!response.ok) throw new Error("Không thể tạo ngựa mới");
  return response.json();
};
