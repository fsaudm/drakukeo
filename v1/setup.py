import sys
sys.setrecursionlimit(10000)

from setuptools import setup

APP = ['app.py']
DATA_FILES = []
OPTIONS = {
    'argv_emulation': True,
    'packages': ['pandas', 'openpyxl', 'numpy'],
    'excludes': [
        'PyInstaller.hooks.hook-gi.repository.GstCheck',
        'PyInstaller.hooks.hook-PyQt6.QtRemoteObjects',
        'PyInstaller.hooks.hook-PyQt5.QtWebEngineWidgets'
    ],
}

setup(
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)