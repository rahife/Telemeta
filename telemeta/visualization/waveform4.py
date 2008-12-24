# Copyright (C) 2008 Parisson SARL
# All rights reserved.
#
# This software is licensed as described in the file COPYING, which
# you should have received as part of this distribution. The terms
# are also available at http://svn.parisson.org/telemeta/TelemetaLicense.
#
# Author: Guillaume Pellerin <pellerin@parisson.com>

from telemeta.core import *
from telemeta.visualization.api import IMediaItemVisualizer
from django.conf import settings
from tempfile import NamedTemporaryFile
from telemeta.visualization.wav2png import *

class WaveFormVisualizer(Component):
    """WaveForm visualization driver (python style)"""

    implements(IMediaItemVisualizer)

    bg_color = None
    color_scheme = None

    def get_id(self):
        return "waveform4"

    def get_name(self):
        return "Waveform (audiolab large)"

    def set_colors(self, background=None, scheme=None):
        self.bg_color = background
        self.color_scheme = scheme

    def render(self, media_item, width=None, height=None, options=None):
        """Generator that streams the waveform as a PNG image with a python method"""

        wav_file = media_item.file.path
        pngFile = NamedTemporaryFile(suffix='.png')

        if not width == None:
            image_width = width
        else:
            image_width = 1800
        if not height == None:
            image_height = height
        else:
            image_height = 300

        fft_size = 2048
        args = (wav_file, pngFile.name, image_width, image_height, fft_size, self.bg_color, self.color_scheme)
        create_wavform_png(*args)

        buffer = pngFile.read(0xFFFF)
        while buffer:
            yield buffer
            buffer = pngFile.read(0xFFFF)

        pngFile.close()

