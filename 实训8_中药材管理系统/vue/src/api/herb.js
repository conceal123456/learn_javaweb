import request from './request'

export const getHerbPage = (params) => request.get('/herb/page', { params })

export const getHerbDetail = (id) => request.get(`/herb/${id}`)

export const addHerb = (data) => request.post('/herb', data)

export const updateHerb = (data) => request.put('/herb', data)

export const deleteHerb = (id) => request.delete(`/herb/${id}`)

export const deleteHerbBatch = (ids) => request.delete('/herb/batch', { data: ids })

export const importHerb = (formData) =>
  request.post('/herb/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const exportHerb = (params) =>
  request.get('/herb/export', { params, responseType: 'blob' })

export const downloadTemplate = () =>
  request.get('/herb/template', { responseType: 'blob' })

export const uploadImage = (formData) =>
  request.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
