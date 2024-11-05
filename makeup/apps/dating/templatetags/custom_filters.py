from django import template

register = template.Library()

@register.filter
def remove_colon(value):
    return value.replace(':', '')
