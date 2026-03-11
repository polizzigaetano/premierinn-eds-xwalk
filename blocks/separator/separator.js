export default function decorate(block) {
  const rows = block.querySelectorAll('.separator > div');
  const style = rows[0]?.textContent?.trim();
  const spacing = rows[1]?.textContent?.trim();

  const hr = document.createElement('hr');
  hr.className = 'separator-line';
  hr.setAttribute('role', 'separator');
  if (style) hr.classList.add(style);
  if (spacing) hr.dataset.spacing = spacing;

  const wrapper = document.createElement('div');
  wrapper.className = 'separator-block';
  if (spacing) wrapper.classList.add(spacing);
  wrapper.appendChild(hr);

  block.replaceChildren(wrapper);
}
