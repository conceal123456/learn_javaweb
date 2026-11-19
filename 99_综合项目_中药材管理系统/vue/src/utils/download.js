export async function downloadBlob(response, fallbackName = 'download.xlsx') {
  const blob = response.data
  if (blob.type && blob.type.includes('application/json')) {
    const text = await blob.text()
    const res = JSON.parse(text)
    throw new Error(res.msg || '下载失败')
  }
  let filename = fallbackName
  const disposition = response.headers['content-disposition'] || ''
  const match = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (match) {
    filename = decodeURIComponent(match[1])
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
