"""Genera deploy/cloud-init.sh con el repositorio y la clave de despliegue. Uso: python3 deploy/render.py <repo-ssh-url> <ruta-clave-privada>"""
import pathlib, sys

here = pathlib.Path(__file__).parent
template = (here / "cloud-init.template.sh").read_text()
key = pathlib.Path(sys.argv[2]).read_text().strip()
out = template.replace("__REPO__", sys.argv[1]).replace("__DEPLOY_KEY__", key)
target = here / "cloud-init.sh"
target.write_text(out)
print(f"{target} ({len(out)} bytes)")
