"""Sarathi SDLC distribution support."""

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("sarathi-sdlc")
except PackageNotFoundError:  # Source checkout without an installed distribution.
    __version__ = "0+unknown"

__all__ = ["__version__"]
