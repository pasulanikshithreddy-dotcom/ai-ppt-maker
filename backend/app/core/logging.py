import logging

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def configure_logging(debug: bool = False) -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)

    if root_logger.handlers:
        return

    logging.basicConfig(
        level=logging.DEBUG if debug else logging.INFO,
        format=LOG_FORMAT,
    )
