import type { ComponentProps } from 'react'
export function TableRoot(props: ComponentProps<'table'>) {
  return <table {...props} />
}
export function TableHead(props: ComponentProps<'thead'>) {
  return <thead {...props} />
}
export function TableBody(props: ComponentProps<'tbody'>) {
  return <tbody {...props} />
}
export function TableRow(props: ComponentProps<'tr'>) {
  return <tr {...props} />
}
export function TableHeaderCell(props: ComponentProps<'th'>) {
  return <th scope="col" {...props} />
}
export function TableCell(props: ComponentProps<'td'>) {
  return <td {...props} />
}
