from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in horyaal/__init__.py
from horyaal import __version__ as version

setup(
	name="horyaal",
	version=version,
	description="hello",
	author="nishow",
	author_email="abdifitahnishow@gmail.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
