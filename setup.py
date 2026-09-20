import os
from glob import glob
from setuptools import find_packages, setup

package_name = 'mysuru_clean_vision'

setup(
    name=package_name,
    version='0.0.1',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name] if os.path.exists('resource/' + package_name) else []),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'), glob('launch/*.launch.py')),
        (os.path.join('share', package_name, 'data'), glob('data/*')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Mysuru Autonomous Systems Team',
    maintainer_email='hackathon@mysuru.gov.in',
    description='Edge-computed anomaly detection pipeline for nighttime municipal garbage truck dashcam footage',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'detection_node = mysuru_clean_vision.detection_node:main',
            'video_publisher = mysuru_clean_vision.video_publisher_node:main',
        ],
    },
)
