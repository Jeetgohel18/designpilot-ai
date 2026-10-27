/** Save a Blob (or text/bytes) as a file and release the temporary object URL. */
export function saveBlob(name: string, data: Blob | BlobPart, type?: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
