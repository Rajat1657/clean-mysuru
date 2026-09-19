from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='mysuru_clean_vision',
            executable='video_publisher',
            name='video_publisher_node',
            output='screen'
        ),
        Node(
            package='mysuru_clean_vision',
            executable='detection_node',
            name='detection_node',
            output='screen'
        )
    ])
