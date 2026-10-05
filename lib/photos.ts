function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("body-burner-photos", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Local photo storage is unavailable."));
  });
}
export async function localPhoto(
  action: "get" | "put" | "delete",
  id: string,
  data?: string,
): Promise<string | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(
      "photos",
      action === "get" ? "readonly" : "readwrite",
    );
    const store = tx.objectStore("photos");
    const request =
      action === "get"
        ? store.get(id)
        : action === "put"
          ? store.put(data, id)
          : store.delete(id);
    let value: string | undefined;
    request.onsuccess = () => {
      value = request.result;
    };
    tx.oncomplete = () => {
      database.close();
      resolve(value);
    };
    tx.onerror = () => {
      database.close();
      reject(new Error("Could not save the photo on this device."));
    };
  });
}
