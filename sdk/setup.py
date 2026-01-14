"""
Chofesh SDK - Build autonomous AI agents with privacy
"""
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="chofesh-sdk",
    version="0.1.0",
    author="Chofesh Team",
    author_email="hello@chofesh.ai",
    description="Build autonomous AI agents with privacy-first architecture",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/chofesh/chofesh-sdk",
    project_urls={
        "Bug Tracker": "https://github.com/chofesh/chofesh-sdk/issues",
        "Documentation": "https://docs.chofesh.ai/sdk",
        "Source Code": "https://github.com/chofesh/chofesh-sdk",
    },
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.31.0",
        "aiohttp>=3.9.0",
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0",
        "typing-extensions>=4.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
            "ruff>=0.1.0",
        ],
        "github": [
            "PyGithub>=2.1.0",
        ],
        "all": [
            "PyGithub>=2.1.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "chofesh=chofesh.cli:main",
        ],
    },
)
