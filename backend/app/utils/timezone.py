from datetime import datetime, timezone, timedelta

def to_ist(dt: datetime) -> datetime:
    """
    Convert a UTC datetime (naive or timezone-aware) to Indian Standard Time (IST).
    If naive, it is assumed to be in UTC.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    return dt.astimezone(ist_tz)


def get_ist_now() -> datetime:
    """
    Get the current time in Indian Standard Time (IST) as a timezone-aware datetime.
    """
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist_tz)
