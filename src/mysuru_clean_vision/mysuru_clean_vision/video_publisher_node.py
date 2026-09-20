import os
import time
import cv2
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image

class VideoPublisher(Node):
    def __init__(self):
        super().__init__('video_publisher')
        self.publisher_ = self.create_publisher(Image, '/dashcam/image_raw', 10)

        self.declare_parameter('use_webcam', True)
        use_webcam = self.get_parameter('use_webcam').get_parameter_value().bool_value

        self.using_webcam = False
        if use_webcam:
            for dev_id in [0, 1, 2, 4]:
                self.get_logger().info(f"Scanning camera device index {dev_id}...")
                cap_test = cv2.VideoCapture(dev_id)
                if cap_test.isOpened():
                    ret, test_frame = cap_test.read()
                    if ret and test_frame is not None and test_frame.size > 0:
                        self.cap = cap_test
                        self.using_webcam = True
                        self.get_logger().info(f"SUCCESS: Connected to live laptop camera at index {dev_id} ({test_frame.shape[1]}x{test_frame.shape[0]}) at 30 FPS!")
                        break
                    cap_test.release()

            if not self.using_webcam:
                self.get_logger().warn("No active webcam sensor found or device busy. Falling back to synthetic night video stream.")

        if not self.using_webcam:
            video_path = os.path.expanduser('~/mysuru_ws/src/mysuru_clean_vision/data/sample_night_drive.mp4')
            if not os.path.exists(video_path):
                self.get_logger().error(f"Video file not found at {video_path}")
                raise FileNotFoundError(f"Video file not found at {video_path}")
            self.cap = cv2.VideoCapture(video_path)
            self.get_logger().info(f"Streaming from synthetic night video file: {video_path}")

        # Set to 30.0 FPS for smooth 30 FPS video streaming
        self.fps = 30.0
        self.timer = self.create_timer(1.0 / self.fps, self.timer_callback)

    def timer_callback(self):
        ret, frame = self.cap.read()
        if not ret or frame is None:
            if not self.using_webcam:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()
            if not ret or frame is None:
                return

        msg = Image()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'dashcam_camera'
        msg.height = frame.shape[0]
        msg.width = frame.shape[1]
        msg.encoding = 'bgr8'
        msg.is_bigendian = 0
        msg.step = frame.shape[1] * 3
        msg.data = frame.tobytes()

        self.publisher_.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = VideoPublisher()
    try:
        rclpy.spin(node)
    except (KeyboardInterrupt, Exception):
        pass
    finally:
        node.cap.release()
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()

if __name__ == '__main__':
    main()
