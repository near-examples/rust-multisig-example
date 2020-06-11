export const copyToClipboard = (url) => {
    const el = document.createElement('textarea')
    el.value = url
    el.setAttribute('readonly', '')
    el.style.position = 'absolute'
    el.style.left = '-1000px'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    el.blur()
    document.body.removeChild(el)
}