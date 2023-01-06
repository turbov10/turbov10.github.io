
# Kubernetes 集群常用工具

服务于故障排查、运维等。

---

## crictl

### 安装 crictl

cri-tools [Release](https://github.com/kubernetes-sigs/cri-tools/releases)

### 配置

你可以用以下方法之一来为 crictl 设置端点（endpoint）：

* 设置参数 `--runtime-endpoint` 和 `--image-endpoint`。
* 设置环境变量 `CONTAINER_RUNTIME_ENDPOINT` 和 `IMAGE_SERVICE_ENDPOINT`。
* 在配置文件 `--config=/etc/crictl.yaml` 中设置端点。要设置不同的文件，可以在运行 crictl 时使用 `--config=PATH_TO_FILE` 标志。

请查看或编辑 `/etc/crictl.yaml` 的内容
```yaml
runtime-endpoint: unix:///var/run/containerd/containerd.sock
image-endpoint: unix:///var/run/containerd/containerd.sock
timeout: 10
debug: true
```

环境变量设置
```sh
export CONTAINER_RUNTIME_ENDPOINT=unix:///var/run/containerd/containerd.sock
export IMAGE_SERVICE_ENDPOINT=unix:///var/run/containerd/containerd.sock
```

进一步了解：[crictl 文档](https://github.com/kubernetes-sigs/cri-tools/blob/master/docs/crictl.md)

---

