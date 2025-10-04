"""Class gallery tables and teacher/gallery permissions

Revision ID: 20250929_1350
Revises: 20250929_1340
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1350'
down_revision = '20250929_1340'
branch_labels = None
depends_on = None

GALLERY_PERMISSIONS = [
    ('gallery:image_upload','Upload class gallery image'),
    ('gallery:image_list','List class gallery images'),
    ('gallery:image_delete','Delete (soft) class gallery image'),
    ('teacher:overview_read','View teacher overview dashboard'),
    ('teacher:class_dashboard','View specific class dashboard'),
]
ROLE_MAP = {
    'ADMIN': [p for p,_ in GALLERY_PERMISSIONS],
    'PRINCIPAL': [p for p,_ in GALLERY_PERMISSIONS],
    'CLASS_TEACHER': ['gallery:image_upload','gallery:image_list','gallery:image_delete','teacher:overview_read','teacher:class_dashboard'],
    'SUBJECT_TEACHER': ['gallery:image_upload','gallery:image_list','teacher:overview_read','teacher:class_dashboard'],
}

def upgrade():
    # Main image table
    op.create_table(
        'class_gallery_image',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('class_section_id', sa.BigInteger(), sa.ForeignKey('academics.class_section.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('blob_id', sa.BigInteger(), sa.ForeignKey('files.blob.id', ondelete='CASCADE'), nullable=False),
        sa.Column('uploader_id', sa.BigInteger(), sa.ForeignKey('core.user_account.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('original_filename', sa.Text(), nullable=False),
        sa.Column('mime_type', sa.Text(), nullable=False),
        sa.Column('size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('content_hash', sa.Text(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('content_hash','class_section_id', name='uq_gallery_content_hash_per_class'),
        schema='files'
    )
    op.create_index('ix_gallery_class_created', 'class_gallery_image', ['class_section_id','created_at'], unique=False, schema='files')

    bind = op.get_bind()
    # Insert permissions
    for code, desc in GALLERY_PERMISSIONS:
        bind.execute(sa.text("INSERT INTO core.permission(code, description) VALUES (:c,:d) ON CONFLICT (code) DO NOTHING"), {'c': code, 'd': desc})
    # Map them to roles
    for role, perms in ROLE_MAP.items():
        for p in perms:
            bind.execute(sa.text("INSERT INTO core.role_permission(role, permission_code) VALUES (:r,:p) ON CONFLICT DO NOTHING"), {'r': role, 'p': p})


def downgrade():
    # Remove role mappings then permissions
    bind = op.get_bind()
    for role, perms in ROLE_MAP.items():
        for p in perms:
            bind.execute(sa.text("DELETE FROM core.role_permission WHERE role=:r AND permission_code=:p"), {'r': role, 'p': p})
    for code,_ in GALLERY_PERMISSIONS:
        bind.execute(sa.text("DELETE FROM core.permission WHERE code=:c"), {'c': code})
    op.drop_index('ix_gallery_class_created', table_name='class_gallery_image', schema='files')
    op.drop_table('class_gallery_image', schema='files')
