export async function storeVector(id: string, vector: number[]) {
  void id;
  void vector;
  return { stored: true };
}

export async function querySimilar(vector: number[], limit = 5) {
  void vector;
  void limit;
  return [];
}